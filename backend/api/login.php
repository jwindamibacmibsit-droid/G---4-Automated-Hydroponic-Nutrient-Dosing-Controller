<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/*
|--------------------------------------------------------------------------
| PostgreSQL Database Configuration
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../configure/connection.php";

/*
|--------------------------------------------------------------------------
| Only POST requests
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Read JSON Request
|--------------------------------------------------------------------------
*/

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);

    exit;
}

$email = trim($input["email"] ?? "");
$passwordInput = $input["password"] ?? "";
$rememberMe = !empty($input["rememberMe"]);

/*
|--------------------------------------------------------------------------
| Validate Input
|--------------------------------------------------------------------------
*/

if ($email === "" || $passwordInput === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please enter your email and password"
    ]);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address"
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Find User
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            last_login
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $stmt->execute([
        ":email" => $email
    ]);

    $userData = $stmt->fetch();

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to process login"
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Check Credentials
|--------------------------------------------------------------------------
*/

if (!$userData || !password_verify($passwordInput, $userData["password_hash"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Update Last Login
|--------------------------------------------------------------------------
*/

try {

    $update = $pdo->prepare("
        UPDATE users
        SET
            last_login = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $update->execute([
        ":id" => $userData["id"]
    ]);

} catch (PDOException $e) {
    // Login can still succeed if updating last_login fails.
}

/*
|--------------------------------------------------------------------------
| Generate Remember Token
|--------------------------------------------------------------------------
*/

$rememberToken = null;

if ($rememberMe) {

    $rememberToken = bin2hex(random_bytes(32));

    try {

        $tokenStmt = $pdo->prepare("
            UPDATE users
            SET
                remember_token = :token,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $tokenStmt->execute([
            ":token" => hash("sha256", $rememberToken),
            ":id" => $userData["id"]
        ]);

    } catch (PDOException $e) {
        $rememberToken = null;
    }
}

/*
|--------------------------------------------------------------------------
| Return User Data
|--------------------------------------------------------------------------
*/

$response = [
    "success" => true,
    "message" => "Login successful.",
    "user" => [
        "id" => (int) $userData["id"],
        "name" => $userData["name"],
        "email" => $userData["email"],
        "password" => $userData["password_hash"],
        "role" => $userData["role"]
    ]
];

if ($rememberToken !== null) {
    $response["remember_token"] = $rememberToken;
}

echo json_encode($response);