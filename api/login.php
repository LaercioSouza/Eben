<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

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

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes']);
  exit;
}

<<<<<<< HEAD
$email = $data['email'];
=======
$username = $data['username'];
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
$password = $data['password'];

// Buscar usuário por telefone ou ID - ADICIONADO TIPO 1 (ADMIN)
$sql = "SELECT * FROM employees 
<<<<<<< HEAD
        WHERE email = :email 
        AND (tipe_user = 1 OR tipe_user = 2)"; // Permitir tipo 1 e 2

$stmt = $pdo->prepare($sql);
$stmt->execute([':email' => $email]);
=======
        WHERE (telefone = :username OR id = :username) 
        AND (tipe_user = 1 OR tipe_user = 2)"; // Permitir tipo 1 e 2

$stmt = $pdo->prepare($sql);
$stmt->execute([':username' => $username]);
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado']);
  exit;
}

<<<<<<< HEAD
// Substitua esta verificação:
// if ($password !== $user['password']) {
// Pela verificação correta com password_verify():
if (!password_verify($password, $user['password'])) {
=======
if ($password !== $user['password']) {
>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
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
<<<<<<< HEAD
=======

>>>>>>> 6ae232c7c61eb2224befb8c7dbf536cbeb0794d5
?>