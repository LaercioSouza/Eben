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

// Definir fuso horário do servidor
date_default_timezone_set('America/Sao_Paulo');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Definir fuso horário do banco de dados
    $pdo->exec("SET time_zone = '-03:00'"); // Fuso horário de Brasília

    // Preparar query baseada no tipo de atualização
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

    echo json_encode(['success' => true, 'message' => 'Status atualizado']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>