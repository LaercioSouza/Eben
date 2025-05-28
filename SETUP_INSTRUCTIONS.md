
# Instruções de Configuração - Migração para MySQL

## 1. Configuração do XAMPP

1. **Instale o XAMPP** se ainda não tiver:
   - Download: https://www.apachefriends.org/download.html

2. **Inicie os serviços necessários**:
   - Abra o painel de controle do XAMPP
   - Inicie o Apache
   - Inicie o MySQL

## 2. Configuração do Banco de Dados

1. **Acesse o phpMyAdmin**:
   - Vá para: http://localhost/phpmyadmin

2. **Execute o script SQL**:
   - Copie todo o conteúdo de `database/schema.sql`
   - Cole na aba SQL do phpMyAdmin
   - Execute o script

## 3. Configuração dos Arquivos

1. **Copie os arquivos PHP**:
   - Copie a pasta `api/` para dentro da pasta do seu projeto no `htdocs`
   - Por exemplo: `C:\xampp\htdocs\seu-projeto\api\`

2. **Ajuste a URL da API**:
   - Edite o arquivo `src/mysql-data-service.js`
   - Modifique a linha: `const API_BASE_URL = 'http://localhost/api';`
   - Para: `const API_BASE_URL = 'http://localhost/seu-projeto/api';`

## 4. Migração dos Dados

1. **Substitua o data service**:
   - No arquivo HTML, substitua:
   ```html
   <script src="/src/data-service.js"></script>
   ```
   - Por:
   ```html
   <script src="/src/mysql-data-service.js"></script>
   ```

2. **Migração automática**:
   - Na primeira execução, o sistema migrará automaticamente os dados do localStorage para o MySQL
   - Verifique o console do navegador para logs da migração

## 5. Teste da Configuração

1. **Acesse sua aplicação**:
   - Vá para: http://localhost/seu-projeto

2. **Teste as funcionalidades**:
   - Criar empresas, funcionários, tarefas e formulários
   - Verificar se os dados persistem após recarregar a página
   - Verificar no phpMyAdmin se os dados estão sendo salvos

## 6. Estrutura de Arquivos

```
seu-projeto/
├── api/
│   ├── config.php       # Configurações do banco
│   ├── save.php         # Endpoint para salvar dados
│   ├── read.php         # Endpoint para ler dados
│   └── delete.php       # Endpoint para deletar dados
├── database/
│   └── schema.sql       # Script de criação do banco
├── src/
│   ├── mysql-data-service.js  # Novo data service
│   └── ... (outros arquivos)
└── SETUP_INSTRUCTIONS.md
```

## 7. Verificação de Erros

### Problemas Comuns:

1. **Erro de CORS**:
   - Verifique se os headers CORS estão configurados nos arquivos PHP

2. **Erro de conexão com banco**:
   - Verifique se MySQL está rodando no XAMPP
   - Confirme as credenciais em `api/config.php`

3. **Erro 404 na API**:
   - Verifique se a pasta `api` está no local correto
   - Confirme a URL base no `mysql-data-service.js`

4. **Dados não aparecem**:
   - Verifique o console do navegador para erros
   - Confirme se os dados foram migrados no phpMyAdmin

## 8. Backup

Antes de fazer a migração completa:
1. Faça backup dos dados do localStorage (se necessário)
2. Teste todas as funcionalidades em ambiente local
3. Só remova o data-service.js original após confirmar que tudo funciona
