<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $empresaId = $_GET['empresaId'] ?? null;

    if (!$empresaId) {
        echo json_encode([]);
        exit;
    }

    // Verifica se é numérico (ID) ou string (CNPJ)
    $isCnpj = !is_numeric($empresaId);
    $field = $isCnpj ? 'cnpj' : 'id';
    
    $stmt = $pdo->prepare("
        SELECT id, nome, cnpj, endereco, telefone 
        FROM companies 
        WHERE parent_id = (SELECT id FROM companies WHERE $field = :empresaId)
    ");
    $stmt->bindParam(':empresaId', $empresaId, $isCnpj ? PDO::PARAM_STR : PDO::PARAM_INT);
    $stmt->execute();

    $subsidiaries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($subsidiaries);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>