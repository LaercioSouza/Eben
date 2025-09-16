<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID do técnico ausente.']);
    exit;
}

try {
    // Verifica se o funcionário está vinculado a alguma tarefa
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM task WHERE colaborador_id = :id");
    $checkStmt->execute([':id' => $data['id']]);
    $taskCount = $checkStmt->fetchColumn();

    if ($taskCount > 0) {
        echo json_encode([
            'status' => 'erro',
            'mensagem' => 'Não é possível excluir: este técnico está vinculado a uma ou mais tarefas.'
        ]);
        exit;
    }

    // Se não tiver vínculo, deleta
    $stmt = $pdo->prepare("DELETE FROM employees WHERE id = :id");
    $stmt->execute([':id' => $data['id']]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Técnico deletado com sucesso.']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Técnico não encontrado ou já deletado.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao deletar: ' . $e->getMessage()]);
}
