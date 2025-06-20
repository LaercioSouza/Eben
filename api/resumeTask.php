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

    // 1. Buscar a pausa mais recente não finalizada
    $stmt = $pdo->prepare("SELECT id, started_at 
                            FROM task_pauses 
                           WHERE task_id = :taskId 
                             AND ended_at IS NULL 
                           ORDER BY started_at DESC 
                           LIMIT 1");
    
    $stmt->execute([':taskId' => $data['taskId']]);
    $pause = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pause) {
        throw new Exception('Nenhuma pausa ativa encontrada para esta tarefa.');
    }

    // 2. Calcular duração da pausa
    $startTime = new DateTime($pause['started_at']);
    $endTime = new DateTime($data['endedAt']);
    $interval = $startTime->diff($endTime);
    $duration = $interval->format('%H:%I:%S');

    // 3. Atualizar registro da pausa
    $stmt = $pdo->prepare("UPDATE task_pauses 
                              SET ended_at = :ended_at,
                                  duration = :duration
                            WHERE id = :id");
    
    $stmt->execute([
        ':ended_at' => $data['endedAt'],
        ':duration' => $duration,
        ':id' => $pause['id']
    ]);

    // 4. Atualizar status da tarefa principal
    $stmt = $pdo->prepare("UPDATE task SET status = 'em_andamento' WHERE id = :taskId");
    $stmt->execute([':taskId' => $data['taskId']]);

    // Confirmar transação
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Pausa finalizada e tarefa retomada']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>