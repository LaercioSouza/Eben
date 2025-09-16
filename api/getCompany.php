<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Verificar se o parâmetro id foi passado via GET
$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID não fornecido']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM companies WHERE id = :id");
$stmt->execute([':id' => $id]);
$company = $stmt->fetch(PDO::FETCH_ASSOC);

if ($company) {
    echo json_encode($company);
} else {
    http_response_code(404);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Empresa não encontrada']);
}