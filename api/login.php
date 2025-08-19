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

$username = $data['username'];
$password = $data['password'];

// Buscar usuário por telefone ou ID - ADICIONADO TIPO 1 (ADMIN)
$sql = "SELECT * FROM employees 
        WHERE (telefone = :username OR id = :username) 
        AND (tipe_user = 1 OR tipe_user = 2)"; // Permitir tipo 1 e 2

$stmt = $pdo->prepare($sql);
$stmt->execute([':username' => $username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado']);
  exit;
}

if ($password !== $user['password']) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Senha incorreta']);
  exit;
}

// Login bem-sucedido - retornar tipo de usuário
unset($user['password']);
echo json_encode([
  'status' => 'sucesso',
  'user' => $user,
  'user_type' => $user['tipe_user'] // Adicionado tipo de usuário na resposta
]);

?>