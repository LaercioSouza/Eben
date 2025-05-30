<?php

// Cabeçalhos CORS e Content-Type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// Configuração do banco de dados
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

// Obtenção dos dados JSON enviados
$input = json_decode(file_get_contents('php://input'), true);


// Valores obrigatórios

$empresaId = $input['empresaid'] ?? null;
$colaboradorId = $input['colaboradorid'] ?? null;


$stmt = $pdo->prepare("SELECT 
    (SELECT nome FROM companies WHERE id = :empresaid) AS companies_nome,
    (SELECT nome FROM employees WHERE id = :colaboradorid) AS employees_nome
");

$stmt->execute([
    ':empresaid' => $empresaId,
    ':colaboradorid' => $colaboradorId
]
  

);

$result = $stmt->fetch(PDO::FETCH_ASSOC);

// ⚠️ Verifique se os resultados realmente existem
$empresaNome = $result['companies_nome'] ?? '';
$colaboradorNome = $result['employees_nome'] ?? '';




if ($success) {
  echo json_encode(['status' => 'sucesso']);
} else {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Falha ao inserir no banco']);
}







?>
