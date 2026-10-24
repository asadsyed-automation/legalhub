'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lawyer_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      headline: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      languages: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: ['Urdu', 'English']
      },
      slotMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Add index on userId for fast relational lookups
    await queryInterface.addIndex('lawyer_profiles', ['userId'], {
      unique: true,
      name: 'lawyer_profiles_user_id_unique_idx'
    });

    // Add index on isPublic for public directory filtering
    await queryInterface.addIndex('lawyer_profiles', ['isPublic'], {
      name: 'lawyer_profiles_is_public_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lawyer_profiles');
  }
};
