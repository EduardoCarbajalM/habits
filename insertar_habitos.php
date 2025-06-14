<?php
require 'vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;

// Configuración de DynamoDB
$client = new DynamoDbClient([
    'region'  => 'us-west-2',
    'version' => 'latest',
    'endpoint' => 'http://localhost:8000'
]);

// Procesar el formulario si se envió
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $habitId = bin2hex(random_bytes(16));
    $currentDate = date('Y-m-d\TH:i:s\Z');
    
    $item = [
        'habitId' => ['S' => $habitId],
        'name' => ['S' => $_POST['name']],
        'description' => ['S' => $_POST['description']],
        'type' => ['S' => $_POST['type']],
        'category' => ['S' => $_POST['category']],
        'createdAt' => ['S' => $currentDate]
    ];

    if ($_POST['type'] === 'numeric') {
        $item['defaultTarget'] = ['N' => (string)$_POST['target']];
        $item['defaultUnit'] = ['S' => $_POST['unit']];
    }

    try {
        $client->putItem([
            'TableName' => 'Habitos',
            'Item' => $item
        ]);
        $success = "¡Hábito insertado correctamente! (ID: $habitId)";
    } catch (Exception $e) {
        $error = "Error al insertar: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insertar Hábitos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; }
        button:hover { background: #45a049; }
        .success { color: green; margin: 15px 0; }
        .error { color: red; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Insertar Nuevo Hábito</h1>
        
        <?php if (isset($success)): ?>
            <div class="success"><?= $success ?></div>
        <?php endif; ?>
        
        <?php if (isset($error)): ?>
            <div class="error"><?= $error ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label for="name">Nombre del hábito:</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="description">Descripción:</label>
                <textarea id="description" name="description" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label for="type">Tipo de hábito:</label>
                <select id="type" name="type" required>
                    <option value="">Seleccione...</option>
                    <option value="boolean">Sí/No (Booleano)</option>
                    <option value="numeric">Numérico (con meta)</option>
                </select>
            </div>
            
            <div class="form-group" id="numeric-fields" style="display: none;">
                <label for="target">Meta diaria (solo numérico):</label>
                <input type="number" id="target" name="target" min="1">
                
                <label for="unit">Unidad (solo numérico):</label>
                <input type="text" id="unit" name="unit">
            </div>
            
            <div class="form-group">
                <label for="category">Categoría:</label>
                <input type="text" id="category" name="category" required>
            </div>
            
            <button type="submit">Insertar Hábito</button>
        </form>
    </div>

    <script>
        // Mostrar/ocultar campos numéricos según el tipo seleccionado
        document.getElementById('type').addEventListener('change', function() {
            const numericFields = document.getElementById('numeric-fields');
            numericFields.style.display = this.value === 'numeric' ? 'block' : 'none';
        });
    </script>
</body>
</html>