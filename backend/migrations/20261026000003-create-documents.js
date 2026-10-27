'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      uploadedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      sizeBytes: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      docType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      visibility: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'private'
      },
      publicId: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      resourceType: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'raw'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('documents', ['caseId'], {
      name: 'documents_case_id_idx'
    });

    await queryInterface.addIndex('documents', ['caseId', 'visibility'], {
      name: 'documents_case_visibility_idx'
    });

    await queryInterface.addIndex('documents', ['uploadedBy'], {
      name: 'documents_uploaded_by_idx'
    });

    await queryInterface.addIndex('documents', ['docType'], {
      name: 'documents_doc_type_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  }
};
