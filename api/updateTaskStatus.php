<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';
$data = json_decode(file_get_contents('php://input'), true);

date_default_timezone_set('America/Sao_Paulo');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '-03:00'");

    // Iniciar transação
    $pdo->beginTransaction();

    if ($data['newStatus'] === 'em_translado') {
        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                transitStartedAt = :transitStartedAt
                              WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => $data['newStatus'],
            ':transitStartedAt' => $data['startTime'],
            ':taskId' => $data['taskId']
        ]);
    } 
    elseif ($data['newStatus'] === 'aguardando_inicio') {
        $taskId = $data['taskId'];
        $endTimeStr = $data['endTime'];

        // Buscar transitStartedAt da task no banco
        $stmt = $pdo->prepare("SELECT transitStartedAt FROM task WHERE id = :taskId");
        $stmt->execute([':taskId' => $taskId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result || !$result['transitStartedAt']) {
            http_response_code(400);
            echo json_encode(['error' => 'transitStartedAt não encontrado para esta tarefa.']);
            exit;
        }

        // Converter datas para objetos DateTime com fuso horário local
        $startTime = new DateTime($result['transitStartedAt'], new DateTimeZone('America/Sao_Paulo'));
        $endTime = new DateTime($endTimeStr, new DateTimeZone('America/Sao_Paulo'));

        // Calcular diferença
        $interval = $startTime->diff($endTime);
        
        // Formatar diferença como H:i:s
        $transitTime = $interval->format('%H:%I:%S');

        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                transitEndLocation = :transitEndLocation,
                                transitTime = :transitTime
                               WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => $data['newStatus'],
            ':transitEndLocation' => $data['coordinates'],
            ':transitTime' => $transitTime,
            ':taskId' => $data['taskId']
        ]);
    }
    elseif ($data['newStatus'] === 'em_andamento') {
        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                taskStartedAt = :taskStartedAt,
                                startLocation = :startLocation
                              WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => $data['newStatus'],
            ':taskStartedAt' => $data['startTime'],
            ':startLocation' => $data['startLocation'],
            ':taskId' => $data['taskId']
        ]);
    }
    elseif ($data['newStatus'] === 'aguardando_retorno') {
        $taskId = $data['taskId'];

        // 1. Buscar informações da tarefa
        $stmt = $pdo->prepare("SELECT taskStartedAt FROM task WHERE id = :taskId");
        $stmt->execute([':taskId' => $taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$task || !$task['taskStartedAt']) {
            throw new Exception('Tarefa não encontrada ou não iniciada.');
        }

        // 2. Calcular tempo total de pausas
        $stmt = $pdo->prepare("SELECT SUM(TIME_TO_SEC(duration)) AS total_pause_seconds 
                                FROM task_pauses 
                               WHERE task_id = :taskId");
        $stmt->execute([':taskId' => $taskId]);
        $pauseResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalPauseSeconds = $pauseResult['total_pause_seconds'] ?? 0;

        // Converter para formato TIME (HH:MM:SS)
        $pauseTime = gmdate('H:i:s', $totalPauseSeconds);

        // 3. Calcular workTime (tempo líquido de trabalho)
        $startTime = new DateTime($task['taskStartedAt']);
        $endTime = new DateTime($data['completedAt']);
        $totalSeconds = $endTime->getTimestamp() - $startTime->getTimestamp();
        $workSeconds = $totalSeconds - $totalPauseSeconds;

        // Garantir que não seja negativo
        if ($workSeconds < 0) {
            $workSeconds = 0;
        }

        $workTime = gmdate('H:i:s', $workSeconds);

        // 4. Atualizar a tarefa
        $stmt = $pdo->prepare("UPDATE task SET 
                                status = :status,
                                completedAt = :completedAt,
                                observations = :observations,
                                completionObservations = :completionObservations,
                                workTime = :workTime,
                                pauseTime = :pauseTime
                               WHERE id = :taskId");
        
        $stmt->execute([
            ':status' => 'aguardando_retorno',
            ':completedAt' => $data['completedAt'],
            ':observations' => $data['observations'],
            ':completionObservations' => $data['completionObservations'],
            ':workTime' => $workTime,
            ':pauseTime' => $pauseTime,
            ':taskId' => $taskId
        ]);
    }

    elseif ($data['newStatus'] === 'retornando') {
    $stmt = $pdo->prepare("UPDATE task SET 
                            status = :status,
                            returnStartedAt = :returnStartedAt,
                            returnStartLocation = :returnStartLocation
                           WHERE id = :taskId");
    
    $stmt->execute([
        ':status' => 'retornando',
        ':returnStartedAt' => $data['startTime'],
        ':returnStartLocation' => $data['returnStartLocation'],
        ':taskId' => $data['taskId']
    ]);
}
    elseif ($data['newStatus'] === 'finalizado') {
    $taskId = $data['taskId'];
    $endTimeStr = $data['endTime'];

    // Buscar returnStartedAt da tarefa no banco
    $stmt = $pdo->prepare("SELECT returnStartedAt FROM task WHERE id = :taskId");
    $stmt->execute([':taskId' => $taskId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result || !$result['returnStartedAt']) {
        http_response_code(400);
        echo json_encode(['error' => 'Horário de início do retorno não encontrado.']);
        exit;
    }

    // Converter datas para objetos DateTime com fuso horário local
    $startTime = new DateTime($result['returnStartedAt'], new DateTimeZone('America/Sao_Paulo'));
    $endTime = new DateTime($endTimeStr, new DateTimeZone('America/Sao_Paulo'));

    // Calcular diferença
    $interval = $startTime->diff($endTime);
    $returnTransitTime = $interval->format('%H:%I:%S');

    // Atualizar a tarefa
    $stmt = $pdo->prepare("UPDATE task SET 
                            status = :status,
                            returnEndLocation = :returnEndLocation,
                            returnTransitTime = :returnTransitTime
                           WHERE id = :taskId");
    
    $stmt->execute([
        ':status' => 'finalizado',
        ':returnEndLocation' => $data['returnEndLocation'],
        ':returnTransitTime' => $returnTransitTime,
        ':taskId' => $taskId
    ]);
}
    elseif ($data['newStatus'] === 'concluida') {
    $taskId = $data['taskId'];

    // Buscar os tempos da tarefa
    $stmt = $pdo->prepare("SELECT 
                            transitStartedAt,
                            taskStartedAt,
                            completedAt,
                            returnStartedAt,
                            finalizedAt
                           FROM task 
                           WHERE id = :taskId");
    $stmt->execute([':taskId' => $taskId]);
    $times = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$times) {
        throw new Exception('Tarefa não encontrada.');
    }

    // Calcular o tempo total da tarefa (do início do translado até a finalização)
    $startTime = new DateTime($times['transitStartedAt']);
    $endTime = new DateTime($data['finalizedAt']);
    $interval = $startTime->diff($endTime);
    $totalTime = $interval->format('%H:%I:%S');

    // Atualizar a tarefa
    $stmt = $pdo->prepare("UPDATE task SET 
                            status = :status,
                            finalizedAt = :finalizedAt,
                            finalObservations = :finalObservations,
                            totalTime = :totalTime
                           WHERE id = :taskId");
    
    $stmt->execute([
        ':status' => 'concluida',
        ':finalizedAt' => $data['finalizedAt'],
        ':finalObservations' => $data['finalObservations'],
        ':totalTime' => $totalTime,
        ':taskId' => $taskId
    ]);
}

    // Confirmar transação
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Status atualizado']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>