<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (empty($email)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail é obrigatório.']);
    exit;
}

// Verifica se o email existe
$stmt = $pdo->prepare("SELECT id FROM employees WHERE email = :email");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail não encontrado.']);
    exit;
}

// Gera token único
$token = bin2hex(random_bytes(50));
$expires = date('Y-m-d H:i:s', strtotime('+1 hour')); // Expira em 1 hora

// Remove tokens anteriores para este email
$stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = :email");
$stmt->execute([':email' => $email]);

// Insere o novo token
$stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (:email, :token, :expires_at)");
$stmt->execute([
    ':email' => $email,
    ':token' => $token,
    ':expires_at' => $expires
]);

// Aqui você deve implementar o envio de email
// Este é um exemplo básico - em produção, use uma biblioteca como PHPMailer
$resetLink = "https://localhost/EBEN/redefinir_senha.html?token=$token";
$assunto = "Recuperação de Senha";
$mensagem = "Olá,\n\nVocê solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:\n\n$resetLink\n\nEste link expira em 1 hora.\n\nSe você não solicitou isso, ignore este email.";

// Para envio real de email, descomente a linha abaixo e ajuste
 mail($email, $assunto, $mensagem, "From: https://localhost/EBEN/redefinir_senha.html");

// Para fins de demonstração, retornamos o link no JSON
echo json_encode([
    'status' => 'sucesso', 
    'mensagem' => 'Email de recuperação enviado.',
    'debug_link' => $resetLink // Remova isso em produção
]);

?>