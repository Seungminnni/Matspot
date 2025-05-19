const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.DB.DATABASE,
  config.DB.USER,
  config.DB.PASSWORD,
  {
    host: config.DB.HOST,
    dialect: config.DB.DIALECT,
    port: config.DB.PORT,
    pool: {
      max: config.DB.POOL.max,
      min: config.DB.POOL.min,
      acquire: config.DB.POOL.acquire,
      idle: config.DB.POOL.idle
    },
    logging: console.log
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 모델 임포트
db.User = require('../models/User')(sequelize, Sequelize);
db.Route = require('../models/Route')(sequelize, Sequelize);
db.Place = require('../models/Place')(sequelize, Sequelize);
db.PlaceImage = require('../models/PlaceImage')(sequelize, Sequelize);
db.Tag = require('../models/Tag')(sequelize, Sequelize);
db.RouteTag = require('../models/RouteTags')(sequelize, Sequelize);

// 관계 설정
// 사용자와 경로 (1:N)
db.User.hasMany(db.Route, { foreignKey: 'creatorId', as: 'routes' });
db.Route.belongsTo(db.User, { foreignKey: 'creatorId', as: 'creator' });

// 경로와 장소 (1:N)
db.Route.hasMany(db.Place, { foreignKey: 'routeId', as: 'places' });
db.Place.belongsTo(db.Route, { foreignKey: 'routeId', as: 'route' });

// 장소와 이미지 (1:N)
db.Place.hasMany(db.PlaceImage, { foreignKey: 'placeId', as: 'images' });
db.PlaceImage.belongsTo(db.Place, { foreignKey: 'placeId', as: 'place' });

// 경로와 태그 (N:M)
db.Route.belongsToMany(db.Tag, { 
  through: db.RouteTag, 
  foreignKey: 'routeId',
  otherKey: 'tagId',
  as: 'tags' 
});
db.Tag.belongsToMany(db.Route, { 
  through: db.RouteTag, 
  foreignKey: 'tagId',
  otherKey: 'routeId',
  as: 'routes' 
});

// 저장된 경로 (N:M)
db.SavedRoutes = sequelize.define('SavedRoutes', {
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: db.User,
      key: 'id'
    }
  },
  routeId: {
    type: Sequelize.INTEGER,
    references: {
      model: db.Route,
      key: 'id'
    }
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: true,
  updatedAt: false,
  tableName: 'saved_routes'
});

db.User.belongsToMany(db.Route, { 
  through: db.SavedRoutes, 
  foreignKey: 'userId',
  otherKey: 'routeId',
  as: 'savedRoutes' 
});
db.Route.belongsToMany(db.User, { 
  through: db.SavedRoutes, 
  foreignKey: 'routeId',
  otherKey: 'userId',
  as: 'savedByUsers' 
});

// 좋아요 (N:M)
db.Likes = sequelize.define('Likes', {
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: db.User,
      key: 'id'
    }
  },
  routeId: {
    type: Sequelize.INTEGER,
    references: {
      model: db.Route,
      key: 'id'
    }
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: true,
  updatedAt: false,
  tableName: 'likes'
});

db.User.belongsToMany(db.Route, { 
  through: db.Likes, 
  foreignKey: 'userId',
  otherKey: 'routeId',
  as: 'likedRoutes' 
});
db.Route.belongsToMany(db.User, { 
  through: db.Likes, 
  foreignKey: 'routeId',
  otherKey: 'userId',
  as: 'likedByUsers' 
});

module.exports = db; 