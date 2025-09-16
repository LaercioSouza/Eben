<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");
header("Content-type: text/plain; charset=utf-8");

// salvar as questões no banco

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);

// Receber JSON do corpo da requisição
$questions = json_decode(file_get_contents('php://input'), true);

// Validar se os dados existem
if (!$questions) {
  echo json_encode(['status' => 'erro', 'mensagem' => 'Dados ausentes!']);
  exit;
}
try {
    $pdo->beginTransaction();

    // Prepara o INSERT da tabela `question`
    $insertQuestion = $pdo->prepare("
    INSERT INTO question (id_formulario, texto, tipo, obrigatoria)
    VALUES (:id_formulario, :texto, :tipo, :obrigatoria)
    ");


    // Prepara o INSERT da tabela `alternativa`
    $insertOption = $pdo->prepare("
        INSERT INTO alternative (id_pergunta, texto)
        VALUES (:id_pergunta, :texto)
    ");

    foreach ($questions as $q) {
        // Valida campos obrigatórios
        /*
        if (!isset($q['id'], $q['id_formulario'], $q['text'], $q['type'], $q['required'])) {
            throw new Exception("Pergunta incompleta: " . json_encode($q));
        }
        */

        if (!isset($q['id_formulario'], $q['text'], $q['type'], $q['required'])) {
            throw new Exception("Pergunta incompleta: " . json_encode($q));
        }
       

 
        $id_formulario = (int)$q['id_formulario'];
        $texto = trim($q['text']);
        $tipo = trim($q['type']);
        $obrigatoria = $q['required'] ? 1 : 0;

        $checkForm = $pdo->prepare("SELECT id FROM form WHERE id = :id");
        $checkForm->execute([':id' => $id_formulario]);

        if ($checkForm->rowCount() === 0) {
            throw new Exception("Formulário com ID $id_formulario não existe.");
}


        // Insere na tabela `question`
        $insertQuestion->execute([
            ':id_formulario' => $id_formulario,
            ':texto' => $texto,
            ':tipo' => $tipo,
            ':obrigatoria' => $obrigatoria
        ]);
        $questionId = $pdo->lastInsertId();

        // Se for radio ou checkbox, insere opções
        if (in_array($tipo, ['radio', 'checkbox']) && isset($q['options']) && is_array($q['options'])) {
            foreach ($q['options'] as $optionText) {
                $insertOption->execute([
                    ':id_pergunta' => $questionId,
                    ':texto' => trim($optionText)
                ]);
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Perguntas e alternativas salvas com sucesso.'
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao salvar: ' . $e->getMessage()
    ]);
}






?>