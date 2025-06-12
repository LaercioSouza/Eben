<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}


$data = json_decode(file_get_contents('php://input'), true);


if (!$data || !isset($data['id'])) {
    
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID de tarefa ausente!.']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM task WHERE id = :id");
    $stmt->execute([':id' => $data['id']]);
    

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Tarefa deletada com sucesso.']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Tarefa não encontrada ou já deletada.']);
    }
} catch (PDOException $e) {
    
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao deletar: ' . $e->getMessage()]);
}
?>
