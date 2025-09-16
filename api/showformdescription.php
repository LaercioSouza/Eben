<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
// Receber JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Validar se os dados existem

if (!isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID não fornecido']);
    exit;
}

$form_id = $data['id'];
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
// Suponha que $resultado seja o resultado da query já feito com fetchAll(PDO::FETCH_ASSOC)
$formularioEstruturado = null;
$perguntasMap = [];

foreach ($resultado as $linha) {
    // Se for a primeira linha, criamos o objeto principal do formulário
    if ($formularioEstruturado === null) {
        $formularioEstruturado = [
            'id_formulario' => $linha['id_formulario'],
            'titulo_formulario' => $linha['titulo_formulario'],
            'descricao_formulario' => $linha['descricao_formulario'],
            'perguntas' => []
        ];
    }

    $idPergunta = $linha['id_pergunta'];

    // Se a pergunta ainda não foi adicionada, criamos ela
    if (!isset($perguntasMap[$idPergunta])) {
        $perguntasMap[$idPergunta] = [
            'id_pergunta' => $linha['id_pergunta'],
            'texto' => $linha['texto_pergunta'],
            'tipo' => $linha['tipo_pergunta'],
            'obrigatoria' => $linha['obrigatoria'],
            'alternativas' => []
        ];
    }

    // Se houver alternativa, adiciona
    if (!empty($linha['id_alternative'])) {
        $perguntasMap[$idPergunta]['alternativas'][] = [
            'id_alternative' => $linha['id_alternative'],
            'texto_alternative' => $linha['texto_alternative']
        ];
    }
}

// Adiciona todas as perguntas no formulário
$formularioEstruturado['perguntas'] = array_values($perguntasMap);

// Retorna como JSON
header('Content-Type: application/json');
echo json_encode($formularioEstruturado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

?>




