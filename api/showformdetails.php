<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao conectar: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID da tarefa não fornecido']);
    exit;
}

$taskId = $data['id'];

try {
    // Busca apenas formulários respondidos com perguntas e respostas
    $formsSql = "
        SELECT
            f.id AS form_id,
            f.titulo AS form_titulo,
            fr.id AS form_response_id,
            fr.respondido_em,
            q.texto AS pergunta,
            q.tipo AS tipo_pergunta,
            COALESCE(
                GROUP_CONCAT(DISTINCT a.texto ORDER BY a.id SEPARATOR ', '),
                qr.resposta_texto
            ) AS resposta
        FROM form_response fr
        JOIN form f ON fr.id_formulario = f.id
        JOIN question_response qr ON qr.id_form_response = fr.id
        JOIN question q ON q.id = qr.id_pergunta
        LEFT JOIN question_response_alternative qra ON qra.id_question_response = qr.id
        LEFT JOIN alternative a ON a.id = qra.id_alternativa
        WHERE fr.task_id = :taskId
        GROUP BY fr.id, q.id
        ORDER BY fr.respondido_em DESC
    ";

    $stmtForms = $pdo->prepare($formsSql);
    $stmtForms->execute([':taskId' => $taskId]);
    $formRows = $stmtForms->fetchAll(PDO::FETCH_ASSOC);

    // Organiza os formulários em estrutura aninhada
    $formResponses = [];
    foreach ($formRows as $row) {
        $formResponseId = $row['form_response_id'];
        
        if (!isset($formResponses[$formResponseId])) {
            $formResponses[$formResponseId] = [
                'form_id' => $row['form_id'],
                'form_titulo' => $row['form_titulo'],
                'respondido_em' => $row['respondido_em'],
                'answers' => []
            ];
        }
        
        $formResponses[$formResponseId]['answers'][] = [
            'questionText' => $row['pergunta'],
            'answer' => $row['resposta']
        ];
    }
    
    // Converte para array indexado e envia como JSON
    echo json_encode(array_values($formResponses));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no banco: ' . $e->getMessage()]);
}
