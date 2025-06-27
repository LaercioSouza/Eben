<?php

// Cabeçalhos para permitir acesso externo
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// Conexão com o banco
$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()]);
    exit;
}

// Recebe os dados JSON do frontend
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID da tarefa não fornecido']);
    exit;
}

$taskId = $data['id'];

// Consulta à tabela task
$sql = "SELECT id, status, formulario_id FROM task WHERE id = :id LIMIT 1";
$stmt = $pdo->prepare($sql);
$stmt->execute([':id' => $taskId]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Tarefa não encontrada']);
    exit;
}

// Renomeia campos para padrão esperado no JS
$response = [
    'id' => $task['id'],
    'status' => $task['status'],
    'formularioId' => $task['formulario_id']
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);

?>
