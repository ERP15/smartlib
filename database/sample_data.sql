-- SmartLib Sample Data
-- Use this file to populate test data

USE smartlib;

-- ============================================
-- INSERT SAMPLE USERS
-- ============================================
INSERT INTO users (student_id, name, email, password, role) VALUES
('STU001', 'John Doe', 'john@example.com', '$2b$12$hash1', 'student'),
('STU002', 'Jane Smith', 'jane@example.com', '$2b$12$hash2', 'student'),
('STU003', 'Bob Wilson', 'bob@example.com', '$2b$12$hash3', 'student'),
('LIB001', 'Alice Johnson', 'alice@example.com', '$2b$12$hash4', 'librarian'),
('ADMIN001', 'Admin User', 'admin@example.com', '$2b$12$hash5', 'admin');

-- ============================================
-- INSERT SAMPLE BOOKS
-- ============================================
INSERT INTO books (title, author, genre, quantity, available_quantity, description, image) VALUES
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 5, 3, 'A gripping tale of racial injustice and childhood innocence', 'https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg'),
('1984', 'George Orwell', 'Dystopian', 4, 2, 'A dark future society under totalitarian rule', 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'),
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 6, 4, 'A classic American novel set in the Jazz Age', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'),
('Pride and Prejudice', 'Jane Austen', 'Romance', 3, 2, 'A witty exploration of love and marriage', 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'),
('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 4, 3, 'A young man\'s journey through New York City', 'https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg'),
('Python Programming', 'Mark Lutz', 'Technical', 2, 2, 'Comprehensive guide to Python', 'https://covers.openlibrary.org/b/isbn/9781449355739-L.jpg'),
('Clean Code', 'Robert Martin', 'Technical', 3, 1, 'A guide to writing better code', 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg');

-- ============================================
-- INSERT SAMPLE BORROW RECORDS
-- ============================================
INSERT INTO borrow_records (user_id, book_id, due_date, actual_return_date, status) VALUES
(1, 1, '2026-06-20 09:00:00', NULL, 'borrowed'),
(2, 2, '2026-06-10 14:30:00', NULL, 'overdue'),
(3, 3, '2026-05-25 16:00:00', '2026-05-24 10:15:00', 'returned'),
(1, 4, '2026-06-15 11:45:00', NULL, 'borrowed');

-- ============================================
-- INSERT SAMPLE RECOMMENDATIONS
-- ============================================
INSERT INTO recommendations (user_id, book_id, reason) VALUES
(1, 2, 'Based on similar genre interest'),
(1, 5, 'Popular among readers like you'),
(2, 4, 'Recommended by librarian'),
(3, 6, 'New technical book in stock');
