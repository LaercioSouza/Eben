<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

// Dados do banco
$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // -------------------------------
    // 1. Consultar Tarefas
    // -------------------------------
    $stmtTasks = $pdo->query("
        SELECT 
            t.id,
            c.nome AS empresa,
            e.nome AS tecnico,
            CONCAT(DATE_FORMAT(t.data_tarefa, '%Y-%m-%d'), ' - ', TIME_FORMAT(t.hora_tarefa, '%H:%i')) AS data_hora,
            t.status,
            t.responsavel,
            TIME_FORMAT(t.tempo_sugerido, '%H:%i') AS tempo_sugerido,
            TIME_FORMAT(COALESCE(t.totalTime, '00:00:00'), '%H:%i') AS tempo_executado,
            COALESCE(t.descricao, 'nenhuma') AS descricao
        FROM task t
        JOIN companies c ON t.empresa_id = c.id
        JOIN employees e ON t.colaborador_id = e.id
        ORDER BY t.data_tarefa DESC, t.hora_tarefa DESC
    ");
    $tasks = $stmtTasks->fetchAll();

    // -------------------------------
    // 2. Consultar Formulários e Respostas
    // -------------------------------
    // Substitua a query $stmtForms por:
$stmtForms = $pdo->query("
    SELECT
        f.id AS form_id,
        f.titulo AS form_titulo,
        fr.id AS form_response_id,
        fr.task_id,
        fr.respondido_em,
        q.texto AS pergunta,
        q.tipo AS tipo_pergunta,
        COALESCE(
            GROUP_CONCAT(DISTINCT a.texto ORDER BY a.id SEPARATOR ', '),
            qr.resposta_texto
        ) AS resposta
    FROM form f
    JOIN form_response fr ON fr.id_formulario = f.id
    JOIN question q ON q.id_formulario = f.id
    JOIN question_response qr ON qr.id_form_response = fr.id AND qr.id_pergunta = q.id
    LEFT JOIN question_response_alternative qra ON qra.id_question_response = qr.id
    LEFT JOIN alternative a ON a.id = qra.id_alternativa
    WHERE (qr.resposta_texto IS NOT NULL OR qra.id_alternativa IS NOT NULL)
    GROUP BY fr.id, q.id
    ORDER BY fr.respondido_em DESC
");
    $formRows = $stmtForms->fetchAll();

    // Organiza os dados em estrutura aninhada
    $formsStructured = [];

    foreach ($formRows as $row) {
        $formId = $row['form_id'];
        $responseId = $row['form_response_id'];

        if (!isset($formsStructured[$formId])) {
            $formsStructured[$formId] = [
                'form_id' => $formId,
                'titulo' => $row['form_titulo'],
                'respostas' => []
            ];
        }

        if (!isset($formsStructured[$formId]['respostas'][$responseId])) {
            $formsStructured[$formId]['respostas'][$responseId] = [
                'form_response_id' => $responseId,
                'task_id' => $row['task_id'], // ADICIONADO AQUI
                'respondido_em' => $row['respondido_em'],
                'perguntas' => []
            ];
        }

        $formsStructured[$formId]['respostas'][$responseId]['perguntas'][] = [
            'pergunta' => $row['pergunta'],
            'tipo' => $row['tipo_pergunta'],
            'resposta' => $row['resposta']
        ];
    }

    // Reindexa para arrays sequenciais
    $formsFinal = array_values(array_map(function($form) {
        $form['respostas'] = array_values($form['respostas']);
        return $form;
    }, $formsStructured));

    // Retorno final
    echo json_encode([
        'success' => true,
        'tarefas' => $tasks,
        'formularios' => $formsFinal
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Erro de conexão ou consulta: ' . $e->getMessage()
    ]);
}
