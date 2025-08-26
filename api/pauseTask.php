<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

$data = json_decode(file_get_contents('php://input'), true);

date_default_timezone_set('America/Sao_Paulo');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '-03:00'");

    // Iniciar transação
    $pdo->beginTransaction();

    // 1. Inserir registro de pausa
    $stmt = $pdo->prepare("INSERT INTO task_pauses 
                            (task_id, started_at, location, reason) 
                           VALUES 
                            (:task_id, :started_at, :location, :reason)");
    
    $stmt->execute([
        ':task_id' => $data['taskId'],
        ':started_at' => $data['startedAt'],
        ':location' => $data['location'],
        ':reason' => $data['reason']
    ]);

    // 2. Atualizar status da tarefa principal
    $stmt = $pdo->prepare("UPDATE task SET status = 'pausada' WHERE id = :taskId");
     $stmt->execute([':taskId' => $data['taskId']]);

    // Confirmar transação
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Pausa iniciada com sucesso']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>