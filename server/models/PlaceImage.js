module.exports = (sequelize, DataTypes) => {
  const PlaceImage = sequelize.define(
    'PlaceImage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      placeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'places',
          key: 'id'
        }
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
      tableName: 'place_images'
    }
  );

  return PlaceImage;
}; 