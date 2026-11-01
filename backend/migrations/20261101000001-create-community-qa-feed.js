'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create community_questions table
    await queryInterface.createTable('community_questions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      practiceArea: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'open'
      },
      answersCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('community_questions', ['practiceArea'], {
      name: 'community_questions_practice_area_idx'
    });
    await queryInterface.addIndex('community_questions', ['status'], {
      name: 'community_questions_status_idx'
    });
    await queryInterface.addIndex('community_questions', ['clientId'], {
      name: 'community_questions_client_id_idx'
    });

    // 2. Create community_answers table
    await queryInterface.createTable('community_answers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      questionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'community_questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lawyerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('community_answers', ['questionId'], {
      name: 'community_answers_question_id_idx'
    });
    await queryInterface.addIndex('community_answers', ['lawyerId'], {
      name: 'community_answers_lawyer_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('community_answers');
    await queryInterface.dropTable('community_questions');
  }
};

