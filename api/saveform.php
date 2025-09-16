<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// salvar as questões no banco

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Receber JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);
date_default_timezone_set('America/Sao_Paulo');
$pdo->exec("SET time_zone = '-03:00'");


// Validar se os dados existem
if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes!']);
  exit;
}

$sql = "INSERT INTO form (id, titulo, descricao, criado_em) VALUES (:id, :titulo, :descricao, :criado_em)";
$stmt = $pdo->prepare($sql);
$success = $stmt->execute([
  ':id' => $data['id'],
  ':titulo' => $data['name'],
  ':descricao' => $data['description'],
  ':criado_em' => $data['createdAt']
]);

if ($success) {
  echo json_encode(['status' => 'sucesso']);
} else {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Falha ao inserir no banco']);
}


?>