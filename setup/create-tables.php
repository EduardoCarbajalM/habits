<?php
require_once '../api/config.php';

try {
    $db = DatabaseConfig::getInstance();
    $dynamoDb = $db->getDynamoDb();
    
    echo "Creando tablas de DynamoDB...\n\n";
    
    // Crear tabla de hábitos
    createHabitsTable($dynamoDb, $db);
    
    // Crear tabla de registros
    createRecordsTable($dynamoDb, $db);
    
    // Crear tabla de notas diarias
    createDailyNotesTable($dynamoDb, $db);
    
    // Crear tabla de usuarios (para futuro)
    createUsersTable($dynamoDb, $db);
    
    echo "\n¡Todas las tablas han sido creadas exitosamente!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

function createHabitsTable($dynamoDb, $db) {
    $tableName = $db->getTableName(Tables::HABITS);
    
    echo "Creando tabla: $tableName\n";
    
    try {
        $result = $dynamoDb->createTable([
            'TableName' => $tableName,
            'KeySchema' => [
                [
                    'AttributeName' => 'id',
                    'KeyType' => 'HASH'
                ]
            ],
            'AttributeDefinitions' => [
                [
                    'AttributeName' => 'id',
                    'AttributeType' => 'S'
                ]
            ],
            'BillingMode' => 'PAY_PER_REQUEST',
            'Tags' => [
                [
                    'Key' => 'Application',
                    'Value' => 'HabitTracker'
                ],
                [
                    'Key' => 'Environment',
                    'Value' => 'Development'
                ]
            ]
        ]);
        
        echo "✓ Tabla $tableName creada exitosamente\n";
        
    } catch (AwsException $e) {
        if ($e->getAwsErrorCode() === 'ResourceInUseException') {
            echo "⚠ Tabla $tableName ya existe\n";
        } else {
            throw $e;
        }
    }
}

function createRecordsTable($dynamoDb, $db) {
    $tableName = $db->getTableName(Tables::RECORDS);
    
    echo "Creando tabla: $tableName\n";
    
    try {
        $result = $dynamoDb->createTable([
            'TableName' => $tableName,
            'KeySchema' => [
                [
                    'AttributeName' => 'habitId',
                    'KeyType' => 'HASH'
                ],
                [
                    'AttributeName' => 'date',
                    'KeyType' => 'RANGE'
                ]
            ],
            'AttributeDefinitions' => [
                [
                    'AttributeName' => 'habitId',
                    'AttributeType' => 'S'
                ],
                [
                    'AttributeName' => 'date',
                    'AttributeType' => 'S'
                ]
            ],
            'BillingMode' => 'PAY_PER_REQUEST',
            'Tags' => [
                [
                    'Key' => 'Application',
                    'Value' => 'HabitTracker'
                ],
                [
                    'Key' => 'Environment',
                    'Value' => 'Development'
                ]
            ]
        ]);
        
        echo "✓ Tabla $tableName creada exitosamente\n";
        
    } catch (AwsException $e) {
        if ($e->getAwsErrorCode() === 'ResourceInUseException') {
            echo "⚠ Tabla $tableName ya existe\n";
        } else {
            throw $e;
        }
    }
}

function createDailyNotesTable($dynamoDb, $db) {
    $tableName = $db->getTableName(Tables::DAILY_NOTES);
    
    echo "Creando tabla: $tableName\n";
    
    try {
        $result = $dynamoDb->createTable([
            'TableName' => $tableName,
            'KeySchema' => [
                [
                    'AttributeName' => 'date',
                    'KeyType' => 'HASH'
                ]
            ],
            'AttributeDefinitions' => [
                [
                    'AttributeName' => 'date',
                    'AttributeType' => 'S'
                ]
            ],
            'BillingMode' => 'PAY_PER_REQUEST',
            'Tags' => [
                [
                    'Key' => 'Application',
                    'Value' => 'HabitTracker'
                ],
                [
                    'Key' => 'Environment',
                    'Value' => 'Development'
                ]
            ]
        ]);
        
        echo "✓ Tabla $tableName creada exitosamente\n";
        
    } catch (AwsException $e) {
        if ($e->getAwsErrorCode() === 'ResourceInUseException') {
            echo "⚠ Tabla $tableName ya existe\n";
        } else {
            throw $e;
        }
    }
}

function createUsersTable($dynamoDb, $db) {
    $tableName = $db->getTableName(Tables::USERS);
    
    echo "Creando tabla: $tableName\n";
    
    try {
        $result = $dynamoDb->createTable([
            'TableName' => $tableName,
            'KeySchema' => [
                [
                    'AttributeName' => 'id',
                    'KeyType' => 'HASH'
                ]
            ],
            'AttributeDefinitions' => [
                [
                    'AttributeName' => 'id',
                    'AttributeType' => 'S'
                ],
                [
                    'AttributeName' => 'email',
                    'AttributeType' => 'S'
                ]
            ],
            'GlobalSecondaryIndexes' => [
                [
                    'IndexName' => 'EmailIndex',
                    'KeySchema' => [
                        [
                            'AttributeName' => 'email',
                            'KeyType' => 'HASH'
                        ]
                    ],
                    'Projection' => [
                        'ProjectionType' => 'ALL'
                    ]
                ]
            ],
            'BillingMode' => 'PAY_PER_REQUEST',
            'Tags' => [
                [
                    'Key' => 'Application',
                    'Value' => 'HabitTracker'
                ],
                [
                    'Key' => 'Environment',
                    'Value' => 'Development'
                ]
            ]
        ]);
        
        echo "✓ Tabla $tableName creada exitosamente\n";
        
    } catch (AwsException $e) {
        if ($e->getAwsErrorCode() === 'ResourceInUseException') {
            echo "⚠ Tabla $tableName ya existe\n";
        } else {
            throw $e;
        }
    }
}
?>
