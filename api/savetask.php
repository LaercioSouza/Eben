
<?php

// Cabeçalhos CORS e Content-Type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// Configuração do banco de dados
$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';


try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}


$data= json_decode(file_get_contents('php://input'), true);
date_default_timezone_set('America/Sao_Paulo');
  if (!$data) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes!']);
  exit;
}
$sql = "INSERT INTO task (id, empresa_id, colaborador_id, responsavel
, tempo_sugerido, data_tarefa, hora_tarefa, descricao, coordenadas,
formulario_id, status, criado_em) values (:id, :empresa_id, :colaborador_id
, :responsavel, :tempo_sugerido, :data_tarefa, :hora_tarefa, :descricao,
:coordenadas, :formulario_id, :status, :criado_em)";
$stmt = $pdo->prepare($sql);
$success = $stmt->execute([
  ':id' => $data['id'],
  ':empresa_id' => $data['empresaid'],
  ':colaborador_id' => $data['colaboradorid'],
  ':responsavel' => $data['responsavel'],
  ':tempo_sugerido' => $data['tempoSugerido'],
  ':data_tarefa' => $data['data'],
  ':hora_tarefa' => $data['hora'],
  ':descricao' => $data['descricao'],
  ':coordenadas' => $data['coordinates'],
  ':formulario_id' => $data['formularioNome'],
  ':status' => $data['status'],
  ':criado_em' => $data['createdAt']
]);

if ($success) {
  echo json_encode(['status' => 'sucesso']);
} else {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Falha ao inserir no banco']);
}

//SELECT nome FROM companies, task WHERE companies.id = task.empresa_id;








// Valores obrigatórios
/*


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

*/





?>
