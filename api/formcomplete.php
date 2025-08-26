<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

// Conexão com o banco
$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "
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

        FROM form f
        JOIN question q ON q.id_formulario = f.id
        JOIN form_response fr ON fr.id_formulario = f.id
        JOIN question_response qr ON qr.id_form_response = fr.id AND qr.id_pergunta = q.id
        LEFT JOIN question_response_alternative qra ON qra.id_question_response = qr.id
        LEFT JOIN alternative a ON a.id = qra.id_alternativa

        WHERE qr.resposta_texto IS NOT NULL OR qra.id_alternativa IS NOT NULL

        GROUP BY f.id, fr.id, q.id
        ORDER BY fr.respondido_em DESC, f.id, q.id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $results = $stmt->fetchAll();

    // Estrutura os dados agrupando por formulário e resposta
    $structured = [];

    foreach ($results as $row) {
        $formId = $row['form_id'];
        $responseId = $row['form_response_id'];

        if (!isset($structured[$formId])) {
            $structured[$formId] = [
                'form_id' => $formId,
                'titulo' => $row['form_titulo'],
                'respostas' => []
            ];
        }

        if (!isset($structured[$formId]['respostas'][$responseId])) {
            $structured[$formId]['respostas'][$responseId] = [
                'form_response_id' => $responseId,
                'respondido_em' => $row['respondido_em'],
                'perguntas' => []
            ];
        }

        $structured[$formId]['respostas'][$responseId]['perguntas'][] = [
            'pergunta' => $row['pergunta'],
            'tipo' => $row['tipo_pergunta'],
            'resposta' => $row['resposta']
        ];
    }

    // Converte os valores para array sequencial
    $output = array_values(array_map(function($form) {
        $form['respostas'] = array_values($form['respostas']);
        return $form;
    }, $structured));

    echo json_encode([
        'success' => true,
        'data' => $output
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}




?>