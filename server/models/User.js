const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: '유효한 이메일 주소를 입력해주세요.'
          },
          notNull: {
            msg: '이메일은 필수 입력값입니다.'
          }
        }
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: {
            msg: '이름은 필수 입력값입니다.'
          }
        }
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: '닉네임은 필수 입력값입니다.'
          }
        }
      },
      profileImage: {
        type: DataTypes.STRING(255),
        defaultValue: ''
      },
      kakaoId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true
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
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password') && user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    }
  );

  // 인스턴스 메소드
  User.prototype.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User.prototype.generateToken = function() {
    return jwt.sign(
      { id: this.id },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );
  };

  return User;
}; 