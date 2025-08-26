<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
<<<<<<< HEAD
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

=======
$db = 'dashboard_db';
$user = 'root';
$pass = '';
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5

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