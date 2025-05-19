module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define(
    'Route',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      totalDistance: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      timestamps: true,
      tableName: 'routes'
    }
  );

  return Route;
}; 