<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8"); // ✅ Mantém apenas essa

$host = 'localhost';
$db = 'dashboard_db';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Receber JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Validar se os dados existem
if (!isset($data['task_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'task_id não fornecido']);
    exit;
}

$task_id = $data['task_id'];

// Primeiro, buscar o formulário associado à task
$stmt = $pdo->prepare("SELECT formulario_id FROM task WHERE id = :task_id LIMIT 1");
$stmt->execute([':task_id' => $task_id]);
$formulario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$formulario || !$formulario['formulario_id']) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Formulário não encontrado para esta task']);
    exit;
}

$form_id = $formulario['formulario_id'];

// Buscar dados do formulário, perguntas e alternativas
$sql = "SELECT
    f.id AS id_formulario,
    f.titulo AS titulo_formulario,
    f.descricao AS descricao_formulario,
    q.id AS id_pergunta,
    q.texto AS texto_pergunta,
    q.tipo AS tipo_pergunta,
    q.obrigatoria AS obrigatoria,
    a.id AS id_alternative,
    a.texto AS texto_alternative
FROM form f
JOIN question q ON f.id = q.id_formulario
LEFT JOIN alternative a ON q.id = a.id_pergunta
WHERE f.id = :form_id
ORDER BY q.id, a.id";

$stmt = $pdo->prepare($sql);
$stmt->execute([':form_id' => $form_id]);
$resultado = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Estruturar dados
$formularioEstruturado = null;
$perguntasMap = [];

foreach ($resultado as $linha) {
    if ($formularioEstruturado === null) {
        $formularioEstruturado = [
            'id_formulario' => $linha['id_formulario'],
            'titulo_formulario' => $linha['titulo_formulario'],
            'descricao_formulario' => $linha['descricao_formulario'],
            'perguntas' => []
        ];
    }

    $idPergunta = $linha['id_pergunta'];

    if (!isset($perguntasMap[$idPergunta])) {
        $perguntasMap[$idPergunta] = [
            'id_pergunta' => $linha['id_pergunta'],
            'texto' => $linha['texto_pergunta'],
            'tipo' => $linha['tipo_pergunta'],
            'obrigatoria' => $linha['obrigatoria'],
            'alternativas' => []
        ];
    }

    if (!empty($linha['id_alternative'])) {
        $perguntasMap[$idPergunta]['alternativas'][] = [
            'id_alternative' => $linha['id_alternative'],
            'texto_alternative' => $linha['texto_alternative']
        ];
    }
}

$formularioEstruturado['perguntas'] = array_values($perguntasMap);

// Retornar JSON
header('Content-Type: application/json');
echo json_encode($formularioEstruturado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);


?>