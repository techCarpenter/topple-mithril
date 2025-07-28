-- DATATYPES --
-- NULL     The value is a NULL value.
-- INTEGER  The value is a signed integer, stored in 0, 1, 2, 3, 4, 6, or 8 bytes depending on the magnitude of the value.
-- REAL     The value is a floating point value, stored as an 8-byte IEEE floating point number.
-- TEXT     The value is a text string, stored using the database encoding (UTF-8, UTF-16BE or UTF-16LE).
-- BLOB     The value is a blob of data, stored exactly as it was input.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  apr REAL NOT NULL,
  min_payment REAL NOT NULL,
  is_closed INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  loan_id INTEGER NOT NULL,
  date INTEGER NOT NULL,
  balance REAL NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);


-- INSERT INTO
--   users (name, email, username)
-- VALUES
--   (
--     'Brian DeVries',
--     'brian@brianjdevries.com',
--     'brianjdevries'
--   );

-- INSERT INTO
--   loans (user_id, name, apr, min_payment, is_closed)
-- VALUES
--   (1, '0127', 5.24, 162.46, 0),
--   (1, '0129', 5.74, 166.43, 0),
--   (1, 'Brian-AA', 3.61, 17.98, 0),
--   (1, 'Brian-AB', 3.61, 11.54, 0),
--   (1, 'Brian-AC', 4.41, 24.65, 0),
--   (1, 'Brian-AD', 4.41, 12.44, 0),
--   (1, 'Brian-AE', 4.04, 29.00, 0),
--   (1, 'Brian-AF', 4.04, 40.01, 0),
--   (1, 'Brian-AG', 3.51, 27.41, 0),
--   (1, 'Brian-AH', 3.51, 36.14, 0),
--   (1, 'Hannah-AA', 3.86, 40.24, 0),
--   (1, 'Hannah-AB', 4.66, 50.03, 0),
--   (1, 'Hannah-AC', 4.66, 12.81, 0),
--   (1, 'Hannah-AD', 4.29, 63.07, 0),
--   (1, 'Hannah-AE', 3.76, 61.80, 0),
--   (1, 'Hannah-AF', 3.76, 82.34, 0),
--   (1, 'Perkins Loan', 5.00, 120.00, 1),
--   (1, 'Ford Escape Auto Loan', 3.74, 316.02, 1),
--   (1, 'Mattress', 29.99, 50.00, 1);

-- SELECT
--   name AS loan,
--   apr,
--   min_payment
-- FROM
--   loans
-- WHERE
--   user_id = 1;--Brian DeVries