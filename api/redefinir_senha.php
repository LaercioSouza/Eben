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
    echo json_encode(['success' => false, 'message' => 'Falha na conexão: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['nova_senha'])) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos. Forneça e-mail e nova senha.']);
    exit;
}

$email = $data['email'];
$nova_senha = $data['nova_senha'];
$senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);

try {
    // Buscar usuário por e-mail
    $sql = "SELECT id FROM employees WHERE email = :email";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Usuário não encontrado.']);
        exit;
    }

    $user_id = $user['id'];

    // Atualizar a senha
    $sqlUpdate = "UPDATE employees SET password = :senha WHERE id = :id";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->execute([
        ':senha' => $senha_hash,
        ':id' => $user_id
    ]);

    if ($stmtUpdate->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Senha redefinida com sucesso.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Nenhuma alteração realizada.']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>