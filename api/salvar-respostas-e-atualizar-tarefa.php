<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// listar empresas

$host = 'localhost';
$db = 'somos220_step_tcbx';
$user = 'somos220_orbecode';
$pass = 'oc#web@2025';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
date_default_timezone_set('America/Sao_Paulo');


try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['taskId'])) {
        throw new Exception("Dados incompletos.");
    }

    $taskId = $data['taskId'];
    $formId = $data['formResponse']['formId'];
    $answers = $data['formResponse']['answers'];
    $completedAt = $data['response'];

    // Conectar ao banco
    $pdo->beginTransaction();
    $pdo->exec("SET time_zone = '-03:00'");

    // Inserir na tabela form_response
    $stmt = $pdo->prepare("INSERT INTO form_response (id_formulario, respondido_em, task_id) VALUES (?, ?, ?)");
    $stmt->execute([$formId, $completedAt, $taskId]);
    $formResponseId = $pdo->lastInsertId();

    // Para cada resposta
    foreach ($answers as $answer) {
        $questionId = $answer['questionId'];
        $questionType = $answer['questionType'];
        $resposta = $answer['answer'];

        // Inserir em question_response
        $stmt = $pdo->prepare("INSERT INTO question_response (id_form_response, id_pergunta, resposta_texto) VALUES (?, ?, ?)");
        
        // Se for checkbox (array de alternativas), salva como texto vazio (relacionamentos vão em outra tabela)
        $respostaTexto = is_array($resposta) ? '' : $resposta;
        $stmt->execute([$formResponseId, $questionId, $respostaTexto]);
        $questionResponseId = $pdo->lastInsertId();

        // Se tiver alternativas (checkbox ou radio), inserir em question_response_alternative
        if ($questionType === 'checkbox') {
             foreach ($resposta as $altTexto) {
        // Buscar o ID da alternativa com base no texto e id_pergunta
                $stmtAlt = $pdo->prepare("SELECT id FROM alternative WHERE texto = ? AND id_pergunta = ?");
                $stmtAlt->execute([$altTexto, $questionId]);
                $altId = $stmtAlt->fetchColumn();

                    if ($altId) {
                         $stmtInsert = $pdo->prepare("INSERT INTO question_response_alternative (id_question_response, id_alternativa) VALUES (?, ?)");
                         $stmtInsert->execute([$questionResponseId, $altId]);
                  }else {
                    throw new Exception("Alternativa '$altTexto' não encontrada para a pergunta ID $questionId.");
        }
    }
} elseif ($questionType === 'radio') {
    // Buscar o ID da alternativa com base no texto e id_pergunta
    $stmtAlt = $pdo->prepare("SELECT id FROM alternative WHERE texto = ? AND id_pergunta = ?");
    $stmtAlt->execute([$resposta, $questionId]);
    $altId = $stmtAlt->fetchColumn();

    if ($altId) {
        $stmtInsert = $pdo->prepare("INSERT INTO question_response_alternative (id_question_response, id_alternativa) VALUES (?, ?)");
        $stmtInsert->execute([$questionResponseId, $altId]);
    } else {
        throw new Exception("Alternativa '$resposta' não encontrada para a pergunta ID $questionId.");
    }
}

    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Respostas salvas com sucesso.'
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}



?>