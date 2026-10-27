const { DataTypes, Model } = require('sequelize');
const { DOCUMENT_TYPES, DOCUMENT_VISIBILITIES } = require('../constants/case');

class Document extends Model {}

/**
 * Initializes the Document model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Document}
 */
const initDocumentModel = (sequelize) => {
  Document.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      caseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        }
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Original file name is required' }
        }
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'MIME type is required' }
        }
      },
      sizeBytes: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          isInt: { msg: 'File size must be an integer' },
          min: { args: [1], msg: 'File size must be greater than 0' }
        }
      },
      docType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [DOCUMENT_TYPES],
            msg: `Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`
          }
        }
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      visibility: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'private',
        validate: {
          isIn: {
            args: [DOCUMENT_VISIBILITIES],
            msg: `Visibility must be one of: ${DOCUMENT_VISIBILITIES.join(', ')}`
          }
        }
      },
      publicId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Storage public ID is required' }
        }
      },
      resourceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'raw'
      }
    },
    {
      sequelize,
      modelName: 'Document',
      tableName: 'documents',
      timestamps: true
    }
  );

  return Document;
};

module.exports = {
  Document,
  initDocumentModel
};
