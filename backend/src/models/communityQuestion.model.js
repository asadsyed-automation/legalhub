const { DataTypes, Model } = require('sequelize');
const { PRACTICE_AREAS } = require('../constants');

class CommunityQuestion extends Model {}

const initCommunityQuestionModel = (sequelize) => {
  CommunityQuestion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          len: {
            args: [5, 150],
            msg: 'Title must be between 5 and 150 characters'
          }
        }
      },
      practiceArea: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [PRACTICE_AREAS],
            msg: `practiceArea must be one of: ${PRACTICE_AREAS.join(', ')}`
          }
        }
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: {
            args: [15, 3000],
            msg: 'Question content must be between 15 and 3000 characters'
          }
        }
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'open',
        validate: {
          isIn: {
            args: [['open', 'closed']],
            msg: 'Status must be either open or closed'
          }
        }
      },
      answersCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'community_questions',
      modelName: 'CommunityQuestion',
      timestamps: true,
      indexes: [
        {
          name: 'community_questions_practice_area_idx',
          fields: ['practiceArea']
        },
        {
          name: 'community_questions_status_idx',
          fields: ['status']
        },
        {
          name: 'community_questions_client_id_idx',
          fields: ['clientId']
        }
      ]
    }
  );

  return CommunityQuestion;
};

module.exports = {
  CommunityQuestion,
  initCommunityQuestionModel
};

