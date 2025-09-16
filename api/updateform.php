<?php
// update_form.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-type: application/json; charset=utf-8");

$host = 'localhost';
$db = 'dashboard_db';$user = 'root';$pass = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents('php://input'), true);

    // Validação básica
    if (empty($data['id_formulario']) || empty($data['titulo_formulario'])) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Dados incompletos']);
        exit;
    }

    $pdo->beginTransaction();

    // 1. Atualizar formulário principal
    $stmtForm = $pdo->prepare("UPDATE form SET titulo = ?, descricao = ? WHERE id = ?");
    $stmtForm->execute([
        $data['titulo_formulario'],
        $data['descricao_formulario'] ?? null,
        $data['id_formulario']
    ]);

    // 2. Processar perguntas
    $existingQuestionIds = [];
    
    foreach ($data['perguntas'] as $pergunta) {
        // 2.1. Se tem ID, é atualização
        if (!empty($pergunta['id_pergunta'])) {
            $stmtQuestion = $pdo->prepare("UPDATE question SET 
                texto = ?, 
                tipo = ?, 
                obrigatoria = ? 
                WHERE id = ? AND id_formulario = ?");
            
            $stmtQuestion->execute([
                $pergunta['texto'],
                $pergunta['tipo'],
                $pergunta['obrigatoria'] ? 1 : 0,
                $pergunta['id_pergunta'],
                $data['id_formulario']
            ]);
            
            $questionId = $pergunta['id_pergunta'];
        } 
        // 2.2. Se não tem ID, é nova pergunta
        else {
            $stmtQuestion = $pdo->prepare("INSERT INTO question 
                (id_formulario, texto, tipo, obrigatoria) 
                VALUES (?, ?, ?, ?)");
            
            $stmtQuestion->execute([
                $data['id_formulario'],
                $pergunta['texto'],
                $pergunta['tipo'],
                $pergunta['obrigatoria'] ? 1 : 0
            ]);
            
            $questionId = $pdo->lastInsertId();
        }
        
        $existingQuestionIds[] = $questionId;
        
        // 3. Processar alternativas apenas para perguntas de opção
        if (in_array($pergunta['tipo'], ['radio', 'checkbox']) && isset($pergunta['alternativas'])) {
            $existingAlternativeIds = [];
            
            foreach ($pergunta['alternativas'] as $alternativa) {
                // 3.1. Se tem ID, é atualização
                if (!empty($alternativa['id_alternative'])) {
                    $stmtAlternative = $pdo->prepare("UPDATE alternative SET 
                        texto = ? 
                        WHERE id = ? AND id_pergunta = ?");
                    
                    $stmtAlternative->execute([
                        $alternativa['texto_alternative'],
                        $alternativa['id_alternative'],
                        $questionId
                    ]);
                    
                    $alternativeId = $alternativa['id_alternative'];
                } 
                // 3.2. Se não tem ID, é nova alternativa
                else {
                    $stmtAlternative = $pdo->prepare("INSERT INTO alternative 
                        (id_pergunta, texto) 
                        VALUES (?, ?)");
                    
                    $stmtAlternative->execute([
                        $questionId,
                        $alternativa['texto_alternative']
                    ]);
                    
                    $alternativeId = $pdo->lastInsertId();
                }
                
                $existingAlternativeIds[] = $alternativeId;
            }
            
            // 3.3. Excluir alternativas removidas
            if (!empty($existingAlternativeIds)) {
                $placeholders = implode(',', array_fill(0, count($existingAlternativeIds), '?'));
                
                $stmtDelete = $pdo->prepare("DELETE FROM alternative 
                    WHERE id_pergunta = ? 
                    AND id NOT IN ($placeholders)");
                
                $params = array_merge([$questionId], $existingAlternativeIds);
                $stmtDelete->execute($params);
            }
        }
    }
    
    // 4. Excluir perguntas removidas
    if (!empty($existingQuestionIds)) {
        $placeholders = implode(',', array_fill(0, count($existingQuestionIds), '?'));
        
        $stmtDelete = $pdo->prepare("DELETE FROM question 
            WHERE id_formulario = ? 
            AND id NOT IN ($placeholders)");
        
        $params = array_merge([$data['id_formulario']], $existingQuestionIds);
        $stmtDelete->execute($params);
    }

    $pdo->commit();
    
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Formulário atualizado com sucesso!'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro no banco de dados: ' . $e->getMessage()
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro geral: ' . $e->getMessage()
    ]);
}