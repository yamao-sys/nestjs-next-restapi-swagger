import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { datasource } from '../data-source';
import { User } from '../src/users/entities/user.entity';
import {
  CurrentEmployment,
  Engineer,
} from '../src/engineers/entities/engineer.entity';
import { ExperiencedDuration } from '../src/experiences/entities/base';
import { Profession } from '../src/professions/entities/profession.entity';
import { ProgrammingLanguage } from '../src/programming-languages/entities/programming-languages.entity';

describe('ProfilesController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let cookie: string;
  let user: User;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // モジュールからインスタンスの作成
    app = moduleFixture.createNestApplication();
    // モジュールの初期化
    app.init();

    await datasource.initialize();
  });

  // テストで起動したNestアプリを終了しないとJestで警告が発生するため、以下のコードで終了
  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });

  afterEach(async () => {
    // テスト毎に、テーブル内のデータを削除する。
    await datasource.synchronize(true);
  });

  describe('/profiles/ (GET)', () => {
    describe('正常系', () => {
      beforeEach(async () => {
        await request(app.getHttpServer()).post('/auth/sign_up').send({
          email: 'test@example.com',
          password: 'password',
        });
        const userRepository = datasource.getRepository(User);
        user = await userRepository.findOneBy({ email: 'test@example.com' });

        const res = await request(app.getHttpServer())
          .post('/auth/sign_in')
          .send({
            email: 'test@example.com',
            password: 'password',
          })
          .expect(200)
          .expect({
            errors: [],
          });
        cookie = res.get('Set-Cookie')[0];
      });

      it('正常系(未登録時)', async () => {
        return await request(app.getHttpServer())
          .get('/profiles')
          .set('Cookie', cookie)
          .expect(200)
          .expect({
            lastName: '',
            firstName: '',
            birthday: '',
            currentEmployment: 'fleelance',
            inWorkingCompanyName: '',
            tel: '',
            latestProject: '',
            currentHourlyWage: 0,
            experiencedDuration: 'lessThanOneYear',
            selfPromotion: '',
            experiencedProfessions: [],
            experiencedProgrammingLanguages: [],
          });
      });

      it('正常系(登録済み)', async () => {
        const professionRepository = datasource.getRepository(Profession);
        const profession = await professionRepository.save({
          name: 'test profession1',
        });
        const programmingLanguageRepository =
          datasource.getRepository(ProgrammingLanguage);
        const programmingLanguage = await programmingLanguageRepository.save({
          name: 'test programmingLanguage1',
        });

        const engineerRepository = datasource.getRepository(Engineer);
        await engineerRepository.save({
          userId: user.id,
          lastName: 'test lastName',
          firstName: 'test firstName',
          birthday: '1111-01-01',
          currentEmployment: 'fleelance' as CurrentEmployment,
          inWorkingCompanyName: 'test inWorkingCompanyName',
          tel: '11122223333',
          latestProject: 'test latestProject',
          currentHourlyWage: 6000,
          experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
          selfPromotion: 'test selfPromotion',
          experiencedProfessions: [
            {
              professionId: profession.id,
              experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
            },
          ],
          experiencedProgrammingLanguages: [
            {
              programmingLanguageId: programmingLanguage.id,
              experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
            },
          ],
        });

        const { body } = await request(app.getHttpServer())
          .get('/profiles')
          .set('Cookie', cookie)
          .expect(200);
        expect(body.experiencedProfessions[0].professionId).toBe(profession.id);
        expect(body.experiencedProfessions[0].experiencedDuration).toBe(
          'lessThanOneYear',
        );
        expect(
          body.experiencedProgrammingLanguages[0].programmingLanguageId,
        ).toBe(programmingLanguage.id);
        expect(
          body.experiencedProgrammingLanguages[0].experiencedDuration,
        ).toBe('lessThanOneYear');
      });
    });

    describe('異常系', () => {
      it('未ログインの時、401が返ること', async () => {
        return request(app.getHttpServer()).get('/profiles').expect(401);
      });
    });
  });

  describe('/profiles/ (POST)', () => {
    describe('正常系', () => {
      let profession: Profession;
      let profession2: Profession;
      let programmingLanguage: ProgrammingLanguage;

      beforeEach(async () => {
        await request(app.getHttpServer()).post('/auth/sign_up').send({
          email: 'test@example.com',
          password: 'password',
        });
        const userRepository = datasource.getRepository(User);
        user = await userRepository.findOneBy({ email: 'test@example.com' });

        const res = await request(app.getHttpServer())
          .post('/auth/sign_in')
          .send({
            email: 'test@example.com',
            password: 'password',
          })
          .expect(200)
          .expect({
            errors: [],
          });
        cookie = res.get('Set-Cookie')[0];

        const professionRepository = datasource.getRepository(Profession);
        profession = await professionRepository.save({
          name: 'test profession1',
        });
        profession2 = await professionRepository.save({
          name: 'test profession2',
        });
        const programmingLanguageRepository =
          datasource.getRepository(ProgrammingLanguage);
        programmingLanguage = await programmingLanguageRepository.save({
          name: 'test programmingLanguage1',
        });
      });

      it('正常系(未登録時に登録できること)', async () => {
        const engineerRepository = datasource.getRepository(Engineer);
        expect(
          await engineerRepository.findOneBy({ userId: user.id }),
        ).toBeFalsy();

        await request(app.getHttpServer())
          .post('/profiles')
          .set('Cookie', cookie)
          .send({
            lastName: 'test new lastName',
            firstName: 'test new firstName',
            birthday: '1234-01-01',
            currentEmployment: 'fleelance',
            inWorkingCompanyName: 'test new inWorkingCompanyName',
            tel: '1234567890',
            latestProject: 'test new latestProject',
            currentHourlyWage: 6000,
            experiencedDuration: 'lessThanOneYear',
            selfPromotion: 'test new selfPromotion',
            experiencedProfessions: [
              {
                professionId: profession.id,
                experiencedDuration: 'lessThanOneYear',
              },
            ],
            experiencedProgrammingLanguages: [
              {
                programmingLanguageId: programmingLanguage.id,
                experiencedDuration: 'lessThanOneYear',
              },
            ],
          })
          .expect(201);
        const createdEngineer = await engineerRepository.findOneBy({
          userId: user.id,
        });
        expect(createdEngineer.lastName).toBe('test new lastName');
      });

      it('正常系(登録済みのプロフィールが更新できること)', async () => {
        const engineerRepository = datasource.getRepository(Engineer);
        await engineerRepository.save({
          userId: user.id,
          lastName: 'test lastName',
          firstName: 'test firstName',
          birthday: '1111-01-01',
          currentEmployment: 'fleelance' as CurrentEmployment,
          inWorkingCompanyName: 'test inWorkingCompanyName',
          tel: '11122223333',
          latestProject: 'test latestProject',
          currentHourlyWage: 6000,
          experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
          selfPromotion: 'test selfPromotion',
          experiencedProfessions: [
            {
              professionId: profession.id,
              experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
            },
          ],
          experiencedProgrammingLanguages: [
            {
              programmingLanguageId: programmingLanguage.id,
              experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
            },
          ],
        });

        await request(app.getHttpServer())
          .post('/profiles')
          .set('Cookie', cookie)
          .send({
            lastName: 'test edit lastName',
            firstName: 'test edit firstName',
            birthday: '1234-01-02',
            currentEmployment: 'fulltime',
            inWorkingCompanyName: 'test edit inWorkingCompanyName',
            tel: '1234567891',
            latestProject: 'test edit latestProject',
            currentHourlyWage: 6001,
            experiencedDuration: 'junior',
            selfPromotion: 'test edit selfPromotion',
            experiencedProfessions: [
              {
                professionId: profession.id,
                experiencedDuration: 'junior',
              },
              {
                professionId: profession2.id,
                experiencedDuration: 'lessThanOneYear' as ExperiencedDuration,
              },
            ],
            experiencedProgrammingLanguages: [
              {
                programmingLanguageId: programmingLanguage.id,
                experiencedDuration: 'junior',
              },
            ],
          })
          .expect(201);
        const updatedEngineer = await engineerRepository.findOne({
          where: { userId: user.id },
          loadEagerRelations: false,
          relationLoadStrategy: 'query', // JOINせず個別にSQL発行
          relations: [
            'experiencedProfessions',
            'experiencedProgrammingLanguages',
          ],
        });
        expect(updatedEngineer.lastName).toBe('test edit lastName');
        expect(
          updatedEngineer.experiencedProfessions.map((ep) => ep.professionId),
        ).toStrictEqual([profession.id, profession2.id]);
        expect(
          updatedEngineer.experiencedProgrammingLanguages.map(
            (ep) => ep.programmingLanguageId,
          ),
        ).toStrictEqual([programmingLanguage.id]);
      });
    });
  });
});