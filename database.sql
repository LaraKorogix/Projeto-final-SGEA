CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(128) NOT NULL,
    telefone VARCHAR(20),
    instituicao_ensino VARCHAR(255),
    perfil VARCHAR(20) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    local VARCHAR(255) NOT NULL,
    capacidade_par INTEGER,
    organizador_id INTEGER NOT NULL,
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE evento_categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evento_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE (evento_id, categoria_id)
);

CREATE TABLE inscricoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_inscricao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presenca INTEGER NOT NULL DEFAULT 0,
    evento_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE (evento_id, usuario_id)
);

CREATE TABLE certificados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_validacao VARCHAR(64) NOT NULL UNIQUE,
    data_emissao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_certificado VARCHAR(200),
    inscricao_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (inscricao_id) REFERENCES inscricoes(id) ON DELETE CASCADE
);
