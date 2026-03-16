/**
 * Post Entity - Domain Layer
 * Pure business entity without framework dependencies
 */
class Post {
  constructor({ id, titulo, conteudo, autor, status = 'draft', createdAt, updatedAt }) {
    this.id = id;
    this.titulo = titulo;
    this.conteudo = conteudo;
    this.autor = autor;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Publish the post
   */
  publish() {
    this.status = 'published';
    this.updatedAt = new Date();
  }

  /**
   * Set post as draft
   */
  setDraft() {
    this.status = 'draft';
    this.updatedAt = new Date();
  }

  /**
   * Check if post is published
   * @returns {boolean}
   */
  isPublished() {
    return this.status === 'published';
  }

  /**
   * Check if post is draft
   * @returns {boolean}
   */
  isDraft() {
    return this.status === 'draft';
  }

  /**
   * Update post content
   * @param {Object} data - Data to update
   */
  update(data) {
    if (data.titulo !== undefined) {
      this.titulo = data.titulo;
    }
    if (data.conteudo !== undefined) {
      this.conteudo = data.conteudo;
    }
    if (data.autor !== undefined) {
      this.autor = data.autor;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.updatedAt = new Date();
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      conteudo: this.conteudo,
      autor: this.autor,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Post;
