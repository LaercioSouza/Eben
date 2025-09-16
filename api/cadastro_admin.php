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

// Validações básicas
if (empty($data['nome']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Campos obrigatórios faltando!']);
    exit;
}

$nome = trim($data['nome']);
$email = trim($data['email']);
$cargo = isset($data['cargo']) ? trim($data['cargo']) : '';
$telefone = isset($data['telefone']) ? trim($data['telefone']) : '';
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$tipe_user = 1; // Tipo administrador
$id = time() . rand(1000, 9999); // Gera um ID único simples

try {
    // Verifica se email já existe
    $check = $pdo->prepare("SELECT id FROM employees WHERE email = :email");
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'E-mail já cadastrado.']);
        exit;
    }

    // Insere no banco usando prepared statements
    $sql = "INSERT INTO employees (id, nome, email, cargo, telefone, password, tipe_user)
            VALUES (:id, :nome, :email, :cargo, :telefone, :password, :tipe_user)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':nome' => $nome,
        ':email' => $email,
        ':cargo' => $cargo,
        ':telefone' => $telefone,
        ':password' => $password,
        ':tipe_user' => $tipe_user
    ]);

    echo json_encode(['success' => true, 'message' => 'Administrador cadastrado com sucesso!']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>