<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes']);
  exit;
}

// Gera senha aleatória de 6 caracteres (letras e números)
function generateRandomPassword($length = 6) {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $password;
}

$senhaGerada = generateRandomPassword();
$tipe_user = 2; // Tipo 2 = Técnico

$sql = "INSERT INTO employees (id, nome, cargo, telefone, created_at, password, tipe_user)
        VALUES (:id, :nome, :cargo, :telefone, :created_at, :password, :tipe_user)";

$stmt = $pdo->prepare($sql);
$success = $stmt->execute([
  ':id' => $data['id'],
  ':nome' => $data['nome'],
  ':cargo' => $data['cargo'],
  ':telefone' => $data['telefone'],
  ':created_at' => $data['createdAt'],
  ':password' => $senhaGerada, // Nova senha gerada
  ':tipe_user' => $tipe_user   // Tipo de usuário fixo
]);

if ($success) {
  // Retorna a senha gerada no response
  echo json_encode([
    'status' => 'sucesso',
    'password' => $senhaGerada,
    'user_type' => $tipe_user
  ]);
} else {
  echo json_encode([
    'status' => 'erro',
    'mensagem' => 'Erro ao inserir: ' . implode(' ', $stmt->errorInfo())
  ]);
}