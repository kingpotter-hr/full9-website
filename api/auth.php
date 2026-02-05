<?php
// api/auth.php - Authentication API
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Login
        if ($_GET['action'] === 'login') {
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            $stmt = $db->prepare("SELECT * FROM admins WHERE email = ?");
            $stmt->execute([$email]);
            $admin = $stmt->fetch();
            
            // Debug logging
        error_log("Login attempt: " . $email);
        error_log("User found: " . ($admin ? 'yes' : 'no'));
        if ($admin) {
            error_log("Hash length: " . strlen($admin['password_hash']));
            error_log("Verify result: " . (password_verify($password, $admin['password_hash']) ? 'true' : 'false'));
        }
        
        if ($admin && password_verify($password, $admin['password_hash'])) {
                $token = generateJWT([
                    'id' => $admin['id'],
                    'email' => $admin['email'],
                    'name' => $admin['name']
                ]);
                
                echo json_encode([
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $admin['id'],
                        'email' => $admin['email'],
                        'name' => $admin['name']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid email or password']);
            }
        }
        
        // Change password
        elseif ($_GET['action'] === 'change-password') {
            $user = requireAuth();
            
            $currentPassword = $data['currentPassword'] ?? '';
            $newPassword = $data['newPassword'] ?? '';
            
            $stmt = $db->prepare("SELECT password_hash FROM admins WHERE id = ?");
            $stmt->execute([$user['id']]);
            $admin = $stmt->fetch();
            
            if (!password_verify($currentPassword, $admin['password_hash'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect']);
                exit;
            }
            
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE admins SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newHash, $user['id']]);
            
            echo json_encode(['success' => true, 'message' => 'Password updated']);
        }
        break;
        
    case 'GET':
        // Get current user
        if ($_GET['action'] === 'me') {
            $user = getAuthUser();
            if ($user) {
                echo json_encode(['user' => $user]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
            }
        }
        break;
}
?>