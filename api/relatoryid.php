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
$charset = 'utf8mb4';

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
    // Busca dados principais da tarefa
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            c.nome AS company_nome,
            e.nome AS employee_nome,
            TIME_FORMAT(t.workTime, '%H:%i:%s') AS workTime
        FROM task t
        JOIN companies c ON t.empresa_id = c.id
        JOIN employees e ON t.colaborador_id = e.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Tarefa não encontrada']);
        exit;
    }

    // Busca histórico da tarefa
    $historySql = "
    SELECT 'criado' AS action, t.criado_em AS timestamp, t.coordenadas AS coordinates, NULL AS observations, NULL AS reason
    FROM task t
    WHERE t.id = :taskId
    
    UNION ALL
    SELECT 'inicio_translado', t.transitStartedAt, t.transitStartLocation, NULL, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'fim_translado', t.transitEndAt, t.transitEndLocation, NULL, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'inicio_tarefa', t.taskStartedAt, t.startLocation, NULL, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'conclusao_tarefa', t.completedAt, t.locationEndTask, t.completionObservations, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'inicio_retorno', t.returnStartedAt, t.returnStartLocation, NULL, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'fim_retorno', t.ReturnEndAt, t.returnEndLocation, NULL, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'finalizada', t.finalizedAt, NULL, t.finalObservations, NULL FROM task t WHERE t.id = :taskId
    UNION ALL
    SELECT 'pausa', tp.started_at, tp.location, NULL, tp.reason FROM task_pauses tp WHERE tp.task_id = :taskId
    UNION ALL
    SELECT 'retomada', tp.ended_at, tp.endLocation, NULL, NULL FROM task_pauses tp WHERE tp.task_id = :taskId
    ORDER BY timestamp ASC
    ";
    
    $stmtHistory = $pdo->prepare($historySql);
    $stmtHistory->execute([':taskId' => $taskId]);
    $history = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);

    // Busca formulários respondidos para esta tarefa
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
    
    // Converte para array indexado
    $formResponsesArray = array_values($formResponses);

    $response = [
        'company' => ['nome' => $task['company_nome']],
        'employee' => ['nome' => $task['employee_nome']],
        'task' => [
            'id' => $task['id'],
            'responsavel' => $task['responsavel'],
            'tempo_sugerido' => $task['tempo_sugerido'],
            'data_tarefa' => $task['data_tarefa'],
            'hora_tarefa' => $task['hora_tarefa'],
            'descricao' => $task['descricao'],
            'status' => $task['status'],
            'workTime' => $task['workTime']
        ],
        'history' => $history,
        'formResponses' => $formResponsesArray
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no banco: ' . $e->getMessage()]);
}