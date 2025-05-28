
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// salvar.php

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Receber os dados JSON
$data = json_decode(file_get_contents('php://input'), true);

// Validar
if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes']);
  exit;
}

// Inserção no banco
$sql = "INSERT INTO employees (id, nome, cargo, telefone, created_at)
        VALUES (:id, :nome, :cargo, :telefone, :created_at)";

$stmt = $pdo->prepare($sql);
$success = $stmt->execute([
  ':id' => $data['id'],
  ':nome' => $data['nome'],
  ':cargo' => $data['cargo'],
  ':telefone' => $data['telefone'],
  ':created_at' => $data['createdAt']
]);

if ($success) {
  echo json_encode(['status' => 'sucesso']);
} else {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao inserir']);
}


?>


