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
('Clean Code', 'Robert Martin', 'Technical', 3, 1, 'A guide to writing better code', 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg'),
('El Filibusterismo', 'Jose Rizal', 'History', 4, 3, 'A novel about the Philippines during Spanish colonial period', NULL);

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

-- ============================================
-- INSERT SAMPLE NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, title, message, book_title, due_date, is_read) VALUES
(1, 'Book Due Reminder', 'Your borrowed book "To Kill a Mockingbird" is due on 2026-06-20 09:00 AM. Please return it on or before the due date.', 'To Kill a Mockingbird', '2026-06-20 09:00:00', 0),
(2, 'Book Overdue Notice', 'The book "1984" was due on June 10, 2026, 02:30 PM and is now overdue. Please return it as soon as possible.', '1984', '2026-06-10 14:30:00', 0),
(3, 'Book Due Reminder', 'Your borrowed book "The Great Gatsby" is due on 2026-06-15 11:45 AM. Please return it on or before the due date.', 'The Great Gatsby', '2026-06-15 11:45:00', 0),
(1, 'Book Return Reminder', 'Your borrowed book "Pride and Prejudice" is approaching its due date. Please prepare to return it on time.', 'Pride and Prejudice', '2026-06-15 11:45:00', 0);

-- ============================================
-- INSERT SAMPLE ADMIN LOGS
-- ============================================
INSERT INTO admin_logs (admin_id, action, details) VALUES
(4, 'Imported sample data', 'Seeded users, books, borrow records, recommendations, and notifications for the SmartLib demo database.'),
(4, 'Reviewed overdue accounts', 'Checked overdue borrow records and generated reminder notifications for affected students.'),
(4, 'Updated library catalog', 'Added a few starter titles and sample borrowing history for testing the catalog and dashboard views.'),
(4, 'User Account Suspended', 'Suspended user STU002 (Jane Smith) due to 5 late returns'),
(4, 'Book Inventory Updated', 'Adjusted inventory for book ID 3 after damaged copy was removed'),
(4, 'Database Maintenance', 'Performed backup and optimization of database tables'),
(4, 'Access Control Review', 'Reviewed and updated librarian permissions for new staff member');

-- ============================================
-- INSERT ADDITIONAL SAMPLE BORROW RECORDS
-- ============================================
INSERT INTO borrow_records (user_id, book_id, due_date, actual_return_date, status) VALUES
(2, 5, '2026-06-18 10:00:00', NULL, 'overdue'),
(3, 7, '2026-06-25 15:30:00', NULL, 'borrowed'),
(1, 6, '2026-06-22 11:00:00', NULL, 'borrowed'),
(2, 8, '2026-05-20 09:00:00', '2026-05-19 14:45:00', 'returned');

-- ============================================
-- INSERT ADDITIONAL SAMPLE NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, title, message, book_title, due_date, is_read) VALUES
(1, 'Account Status Update', 'Your account is in good standing. You have borrowed 2 books.', NULL, NULL, 1),
(2, 'Account Suspension Warning', 'You have accumulated 5 late returns. Your account has been suspended. Please contact the librarian.', NULL, NULL, 0),
(3, 'Returned Book Confirmation', 'Thank you for returning "The Great Gatsby". Your balance is up to date.', 'The Great Gatsby', '2026-05-24 10:15:00', 1),
(1, 'New Book Available', 'A new technical book "Python Programming Advanced" has been added to the library.', NULL, NULL, 0),
(3, 'Late Return Fee', 'You have an outstanding late return fee of $2.50 for overdue books.', NULL, NULL, 0);
