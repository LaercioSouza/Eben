 <?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

$input = json_decode(file_get_contents('php://input'), true);


$empresaId = $input['empresaid'] ?? null;
$colaboradorId = $input['colaboradorid'] ?? null;

$stmt = $pdo->prepare("SELECT 
    (SELECT nome FROM companies WHERE id = :empresaid) AS companies_nome,
    (SELECT nome FROM employees WHERE id = :colaboradorid) AS employees_nome
");

$stmt->execute([
    ':empresaid' => $empresaId,
    ':colaboradorid' => $colaboradorId
]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);
$empresaNome = $result['empresa_nome'];
$colaboradorNome = $result['colaborador_nome'];


$sql = "INSERT INTO tarefas (
  id, empresa_nome, filial_id, colaborador_id, colaborador_nome, responsavel,
  tempo_sugerido, data, hora, descricao, coordinates,
  formulario_nome, formulario_resposta, status, history, created_at
) VALUES (
  :id, :empresa_nome, :filial_id, :colaborador_id, :colaborador_nome, :responsavel,
  :tempo_sugerido, :data, :hora, :descricao, :coordinates,
  :formulario_nome, :formulario_resposta, :status, :history, :created_at
)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':id' => $input['id'],
    ':empresa_nome' => $empresaNome,
    ':colaborador_id' => $input[''],
    ':colaborador_nome' => $colaboradorNome,
    ':descricao' => $descricao,
    ':created_at' => date('Y-m-d H:i:s')
]);


echo json_encode([
    'empresaNome' => $result['companies_nome'],
    'colaboradorNome' => $result['employees_nome']
]);

 



?>


