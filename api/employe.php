<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Protege contra campos faltando
$employeeId   = $data['id']        ?? null;
$employeeNome = trim($data['nome'] ?? '');
$employeeEmail = trim($data['email'] ?? '');
$employeeCargo = trim($data['cargo'] ?? '');
$employeeTelefone = trim($data['telefone'] ?? '');
$employeeCreatedAt = $data['createdAt'] ?? date('Y-m-d H:i:s');

if (empty($employeeNome) || empty($employeeEmail) || empty($employeeCargo) || empty($employeeTelefone)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Campos obrigatórios ausentes.']);
    exit;
}

// Função para gerar senha aleatória
function generateRandomPassword($length = 6) {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $password;
}

$senhaGerada = generateRandomPassword();
$senhaHash = password_hash($senhaGerada, PASSWORD_DEFAULT);
$tipo_user = 2; // Técnico

try {
    // Verifica se email já existe
    $check = $pdo->prepare("SELECT id FROM employees WHERE email = :email");
    $check->execute([':email' => $employeeEmail]);
    if ($check->fetch()) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail já cadastrado.']);
        exit;
    }

    $sql = "INSERT INTO employees 
            (id, nome, email, cargo, telefone, created_at, password, tipe_user)
            VALUES (:id, :nome, :email, :cargo, :telefone, :created_at, :password, :tipe_user)";
    $stmt = $pdo->prepare($sql);

    $success = $stmt->execute([
        ':id' => $employeeId,
        ':nome' => $employeeNome,
        ':email' => $employeeEmail,
        ':cargo' => $employeeCargo,
        ':telefone' => $employeeTelefone,
        ':created_at' => $employeeCreatedAt,
        ':password' => $senhaHash,
        ':tipe_user' => $tipo_user
    ]);

    if ($success) {
        echo json_encode([
            'status' => 'sucesso',
            'mensagem' => "Técnico cadastrado com sucesso",
            'password' => $senhaGerada, // Retorna senha em texto para administrador
            'user_type' => $tipo_user,
            'received_data' => $data
        ]);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Falha ao cadastrar técnico.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro no banco: ' . $e->getMessage()]);
}
