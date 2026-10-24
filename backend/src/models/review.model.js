const { DataTypes, Model } = require('sequelize');
const { REVIEW_CONSTANTS } = require('../constants/engagement');

class Review extends Model {}

/**
 * Initializes the Review model on the provided Sequelize instance.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Review}
 */
const initReviewModel = (sequelize) => {
  Review.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [REVIEW_CONSTANTS.MIN_RATING],
            msg: `Rating must be at least ${REVIEW_CONSTANTS.MIN_RATING}`
          },
          max: {
            args: [REVIEW_CONSTANTS.MAX_RATING],
            msg: `Rating cannot exceed ${REVIEW_CONSTANTS.MAX_RATING}`
          }
        }
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Review comment cannot be empty' },
          len: {
            args: [REVIEW_CONSTANTS.MIN_COMMENT_LENGTH, REVIEW_CONSTANTS.MAX_COMMENT_LENGTH],
            msg: `Review comment must be between ${REVIEW_CONSTANTS.MIN_COMMENT_LENGTH} and ${REVIEW_CONSTANTS.MAX_COMMENT_LENGTH} characters`
          }
        }
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lawyerReply: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      repliedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'reviews',
      modelName: 'Review',
      timestamps: true
    }
  );

  return Review;
};

module.exports = {
  Review,
  initReviewModel
};
