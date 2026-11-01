const { DataTypes, Model } = require('sequelize');

class CommunityAnswer extends Model {}

const initCommunityAnswerModel = (sequelize) => {
  CommunityAnswer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      questionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'community_questions',
          key: 'id'
        }
      },
      lawyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: {
            args: [10, 5000],
            msg: 'Legal answer must be between 10 and 5000 characters'
          }
        }
      }
    },
    {
      sequelize,
      tableName: 'community_answers',
      modelName: 'CommunityAnswer',
      timestamps: true,
      indexes: [
        {
          name: 'community_answers_question_id_idx',
          fields: ['questionId']
        },
        {
          name: 'community_answers_lawyer_id_idx',
          fields: ['lawyerId']
        }
      ]
    }
  );

  return CommunityAnswer;
};

module.exports = {
  CommunityAnswer,
  initCommunityAnswerModel
};

