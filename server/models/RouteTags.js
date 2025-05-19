module.exports = (sequelize, DataTypes) => {
  const RouteTag = sequelize.define(
    'RouteTag',
    {
      routeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'routes',
          key: 'id'
        }
      },
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'tags',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      timestamps: true,
      updatedAt: false,
      tableName: 'route_tags'
    }
  );

  return RouteTag;
}; 